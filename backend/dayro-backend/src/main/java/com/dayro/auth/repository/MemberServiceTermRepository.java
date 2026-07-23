package com.dayro.auth.repository;

import com.dayro.auth.domain.MemberServiceTerm;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MemberServiceTermRepository extends JpaRepository<MemberServiceTerm, UUID> {
}
